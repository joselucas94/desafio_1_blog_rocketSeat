import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Prismic from "@prismicio/client";
import { RichText } from 'prismic-dom';
import {FiCalendar, FiUser, FiClock} from 'react-icons/fi';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps) {

  const router = useRouter();
  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  const AVARAGE_READ_TIME = 200; // 200 words per minute;

  const totalWords = post.data.content.reduce((acumulator, item) => {
    return (
      acumulator +
      item.heading?.split(' ').length +
      item.body.reduce((acumulator2, contentBody) => {
        return acumulator2 + contentBody.text.split(' ').length;
      }, 0)
    );
  }, 0);

  const timeOfReading = Math.ceil(totalWords / AVARAGE_READ_TIME);

  return(
    <>
    <main className={styles.container}>
      <img src={post.data.banner.url} alt="banner" />
      <div className={styles.content}>
        <h1>{post.data.title}</h1>
        <FiCalendar/><span> { new Date(post.first_publication_date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })} </span>
         <FiUser/><span>{post.data.author}</span>
         <FiClock/><span>{timeOfReading} min</span>
        <div className={styles.post}>
          {post.data.content.map(contentElement => {
            return (
              <article key={contentElement.heading}>
                <h2>{contentElement.heading}</h2>
                <div
                        className={styles.postContent}
                        dangerouslySetInnerHTML={{__html:RichText.asHtml(contentElement.body)}}/>
              </article>
            )
          })}
        </div>
      </div>
      
    </main>
    
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      fetch: [],
      pageSize: 10,
    }
  );
  return {
    paths: posts.results.map((post) => {
      return { params: { slug: post.uid, }}
    }),
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const post = await prismic.getByUID('post', String(slug), {});

  console.log(post);

  return { props: { post }};
};
