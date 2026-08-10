import Menu from "@/components/Menu/Menu";
import styles from "./singlePage.module.css";
import Image from "next/image";
import Comments from "@/components/comments/Comments";
import DeletePostButton from "@/components/deletePostButton/DeletePostButton";
import { timeAgo } from "@/utils/timeAgo";
import prisma from "@/utils/connect";
import { notFound } from "next/navigation";

const getData = async (slug) => {
  try {
    const post = await prisma.post.update({
      where: { slug },
      data: { views: { increment: 1 } },
      include: { user: true },
    });
    return post;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const SinglePage = async ({ params }) => {
  const { slug } = params;

  const data = await getData(slug);

  if (!data) {
    notFound();
  }

  // Quill editor stores &nbsp; (non-breaking spaces) between words,
  // and also embeds inline background-color/color styles from the theme
  // active at write-time. Strip both so content adapts to any theme.
  const sanitizeHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/&nbsp;/g, " ")
      .replace(/\u00A0/g, " ")
      .replace(/background-color\s*:\s*[^;"']+;?/gi, "")
      .replace(/(?<![a-z-])color\s*:\s*[^;"']+;?/gi, "");
  };

  return (
    <div className={styles.container}>
      <div className={styles.infoContainer}>
        <div className={styles.textContainer}>
          <h1 className={styles.title}>{data?.title}</h1>
          <div className={styles.user}>
            <div className={styles.userImageContainer}>
              <Image
                src={
                  data?.user?.image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    data?.user?.name || "Author"
                  )}&background=dc143c&color=fff&bold=true`
                }
                alt={data?.user?.name || "Author avatar"}
                fill
                className={styles.avatar}
              />
            </div>
            <div className={styles.userTextContainer}>
              <span className={styles.username}>{data?.user?.name}</span>
              <span className={styles.date}>
                {data?.createdAt ? timeAgo(data.createdAt) : ""}
              </span>
              <DeletePostButton slug={slug} authorEmail={data?.userEmail} />
            </div>
          </div>
        </div>
        {data?.img && (
          <div className={styles.imageContainer}>
            <Image src={data.img} alt="" fill className={styles.image} />
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.post}>
          <div
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(data?.desc) }}
          />
          <div className={styles.comment}>
            <Comments postSlug={slug}/>
          </div>
        </div>
        <Menu />
      </div>
    </div>
  );
};

export default SinglePage;