import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = ({ style, className }) => {
  return <div className={`${styles.skeleton} ${className}`} style={style}></div>;
};

export default Skeleton;