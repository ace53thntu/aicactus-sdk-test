import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';

const Index = () => {
  const onHandleClickMe = () => {
    console.log('Click me!!!');
  };

  return (
    <div className="container bg-primary page">
      <Head>
        <title>Home page</title>
        <meta property="og:title" content="My page title" key="title" />
      </Head>
      <h1>Hello, world!</h1>
      <Link href="/about">
        <a className="btn btn-light">About us</a>
      </Link>
      <button onClick={onHandleClickMe}>Click me</button>
    </div>
  );
};

export default Index;
