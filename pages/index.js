import Head from 'next/head';
import styles from '../styles/Home.module.css';
import GitHubIcon from '@material-ui/icons/GitHub';
import LinkedInIcon from '@material-ui/icons/LinkedIn';
import { IconButton } from '@material-ui/core';
import Link from 'next/link';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Rodney Mandap</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Rodney Jan Mandap
        </h1>

        <p className={styles.description}>
          DevOps Engineer | Self-taught Full Stack Developer
        </p>

       <div >
         <IconButton color="primary">
           <Link href="https://github.com/rodneymandap/">
            <GitHubIcon/>
           </Link>
         </IconButton>
         <IconButton color="primary">
           <Link href="https://www.linkedin.com/in/rjmandap">
            <LinkedInIcon/>
           </Link>
         </IconButton>
       </div>


      </main>

      {/* <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer> */}
    </div>
  )
}
