import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {FiCalendar, FiUser} from 'react-icons/fi';

import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';


interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  posts: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.posts);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function loadNextPage(url: string) {
    const data = await fetch(url).then(response => response.json());
    setNextPage(data.next_page);

    setPosts(state => [...state, ...data.results]);
  }
  return (
    <>    
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`}>
              <a key={post.uid}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <FiCalendar/><time>{post.first_publication_date}</time>
                <FiUser/><span>{post.data.author}</span>
              </a>
            </Link>
          ))}

          {nextPage && (
              <button
                className={styles.loadMore}
                onClick={() => loadNextPage(nextPage)}
              >
                Carregar mais posts
              </button>
            )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['publication.title', 'publication.content'],
    pageSize: 1
  });

  console.log(postsResponse)

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: new Date(post.first_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })
  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        posts: posts,
      },
    },
  }
};
