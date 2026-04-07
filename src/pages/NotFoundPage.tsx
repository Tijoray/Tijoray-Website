import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page not found.</h1>
        <p className={styles.body}>
          This page doesn't exist or may have moved.<br />
          You may have followed a broken link.
        </p>
        <Link to="/" className={styles.cta}>Return Home</Link>
      </div>
    </main>
  )
}
