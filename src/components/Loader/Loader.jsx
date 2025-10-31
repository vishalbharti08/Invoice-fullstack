import styles from "./Loader.module.css";

const Loader = () => {
  return (
    <div className={styles.loader}>
      <div className={styles.loader__bar}></div>
      <div className={styles.loader__bar}></div>
      <div className={styles.loader__bar}></div>
      <div className={styles.loader__bar}></div>
      <div className={styles.loader__bar}></div>
      <div className={styles.loader__ball}></div>
    </div>
  );
};

export default Loader;
