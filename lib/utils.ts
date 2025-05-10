import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * tailwind 클래스를 조건부로 결합하는 유틸리티 함수
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date: string | Date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 활동 기간을 사람이 읽기 쉬운 형식으로 변환
 */
export function formatDuration(startDate: string | Date, endDate?: string | Date) {
  const start = new Date(startDate);
  const startStr = `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  
  if (!endDate) {
    return `${startStr} ~ 현재`;
  }
  
  const end = new Date(endDate);
  const endStr = `${end.getFullYear()}년 ${end.getMonth() + 1}월`;
  
  return `${startStr} ~ ${endStr}`;
}

/**
 * 사용자명 유효성 검사 (영문, 숫자, 언더스코어, 대시만 허용)
 */
export function isValidUsername(username: string) {
  const regex = /^[a-zA-Z0-9_-]+$/;
  return regex.test(username);
} 