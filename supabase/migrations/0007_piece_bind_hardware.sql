-- Migration: bind a chip UID to a piece by its serial, in one checked step.
--
-- The admin panel could already record a Tag UID, but only the long way round:
-- find the piece, open it, paste the UID into a text box, save. At a bench with
-- a tag in one hand and a phone in the other, that is three screens between
-- writing a tag and recording it, and the step that gets skipped is the
-- recording — which is exactly the step that makes a physical tag traceable.
--
-- This is the short way: the two things the operator is holding are the TIJ
-- code they just wrote and the UID they just read, so those are the two
-- arguments. No piece id, no navigation.
--
-- The checks live here rather than in the panel because the panel is not the
-- only thing that will ever call this. A bench tool, a batch importer or a
-- second operator's session all get the same guarantees.

create or replace function public.piece_bind_hardware(
  p_serial      text,
  p_hardware_id text
)
returns table (
  piece_id      uuid,
  serial        text,
  hardware_id   text,
  nfc_linked_at timestamp,
  -- True when this exact pairing already existed. Re-scanning a tag that is
  -- already recorded is a normal thing to do at a bench and must not read as
  -- an error, but the operator should still be told nothing changed.
  already_bound boolean
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_serial text;
  v_uid    text;
  v_piece  "Pieces";
  v_owner  text;
begin
  v_serial := upper(trim(coalesce(p_serial, '')));

  -- Separators vary by vendor and by whoever transcribed the datasheet:
  -- 04:A2:B3, 04 A2 B3 and 04-a2-b3 are the same tag.
  v_uid := upper(regexp_replace(coalesce(p_hardware_id, ''), '[[:space:]:.\-]', '', 'g'));

  if v_serial !~ '^TIJ-[0-9A-F]{10}$' then
    raise exception 'That is not a Tijoray serial. Expected TIJ- followed by ten hex characters, got %', p_serial
      using errcode = 'check_violation';
  end if;

  -- A UID is hex, so this also catches the mistake this pair of fields invites
  -- most: pasting the serial into the UID argument. Worth its own sentence,
  -- because "not hexadecimal" would not tell the operator what they did.
  if v_uid like 'TIJ%' then
    raise exception 'The second argument is the chip UID, not the serial. The TIJ- code goes in the first.'
      using errcode = 'check_violation';
  end if;

  if v_uid !~ '^[0-9A-F]{8,32}$' then
    raise exception 'That is not a chip UID. Expected 8 to 32 hexadecimal characters, got %', p_hardware_id
      using errcode = 'check_violation';
  end if;

  select * into v_piece from "Pieces" p where p.serial = v_serial;
  if not found then
    raise exception 'No piece has serial %', v_serial
      using errcode = 'no_data_found';
  end if;

  -- Already this exact pairing: nothing to do, and say so.
  if v_piece.hardware_id is not null and v_piece.hardware_id = v_uid then
    return query select v_piece.id, v_piece.serial, v_piece.hardware_id,
                        v_piece.nfc_linked_at, true;
    return;
  end if;

  -- Rebinding a piece to a different tag is not something to do by accident —
  -- the first tag is out there and would still resolve. Clear the field in the
  -- panel first if the piece genuinely got a new tag.
  if v_piece.hardware_id is not null then
    raise exception 'Piece % is already bound to tag %. Clear its Tag UID first if it has been retagged.',
      v_serial, v_piece.hardware_id
      using errcode = 'unique_violation';
  end if;

  -- The unique index would catch this anyway, but a raw 23505 tells the
  -- operator nothing about which piece is holding the tag.
  select p.serial into v_owner from "Pieces" p where p.hardware_id = v_uid;
  if v_owner is not null then
    raise exception 'Tag % is already bound to piece %', v_uid, v_owner
      using errcode = 'unique_violation';
  end if;

  update "Pieces" p
     set hardware_id   = v_uid,
         -- Stored UTC, matching every other timestamp the app writes through
         -- this column (which is `timestamp without time zone`).
         nfc_linked_at = timezone('utc', now())
   where p.id = v_piece.id
  returning p.id, p.serial, p.hardware_id, p.nfc_linked_at, false
       into piece_id, serial, hardware_id, nfc_linked_at, already_bound;

  return next;
end;
$$;

comment on function public.piece_bind_hardware(text, text) is
  'Binds a chip UID to the piece with the given TIJ- serial. Idempotent for an identical rebind; raises otherwise.';

-- Ops surface, not a customer one. The admin API calls this with the service
-- role; nothing a browser holds should be able to reach it.
revoke all on function public.piece_bind_hardware(text, text) from public;
revoke all on function public.piece_bind_hardware(text, text) from anon;
revoke all on function public.piece_bind_hardware(text, text) from authenticated;
grant execute on function public.piece_bind_hardware(text, text) to service_role;
