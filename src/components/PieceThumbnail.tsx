import PendantThumbnail from './PendantThumbnail'
import BraceletThumbnail from './BraceletThumbnail'
import type { Shape, Metal, MetalColor } from '../data/catalog'

type Props = {
  productType:     string
  shape:           Shape
  metal:           Metal
  metalColor:      MetalColor
  birthstoneIndex: number
  size?:           number
}

/** Renders the correct static 3D thumbnail for a cart/checkout item's product type. */
export default function PieceThumbnail({ productType, ...rest }: Props) {
  return productType === 'bracelet'
    ? <BraceletThumbnail {...rest} />
    : <PendantThumbnail {...rest} />
}
