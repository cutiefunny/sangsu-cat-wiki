import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./clientApp";

/**
 * 24시간 이내에 생성된 고양이 도감 목록을 가져옵니다.
 * @returns {Promise<Array>} 최근 고양이 데이터 배열
 */
export const fetchRecentCats = async () => {
  const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  const catsCollection = collection(db, "cats");
  const q = query(
    catsCollection,
    where("createdAt", ">=", twentyFourHoursAgo),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  const cats = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return cats;
};