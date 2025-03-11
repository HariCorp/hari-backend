/**
 * Quy ước đặt tên topic
 */
export const TOPIC_PREFIX = 'ms';

/**
 * Tạo tên topic từ các thành phần
 * @param service Tên service
 * @param entity Tên entity
 * @param action Hành động
 * @returns Tên topic
 */
export const createTopicName = (
  service: string,
  entity: string,
  action: string,
): string => {
  return `${TOPIC_PREFIX}.${service}.${entity}.${action}`;
};

/**
 * Các topic đặc biệt
 */
export enum SpecialTopic {
  DEAD_LETTER = 'dead-letter',
  RETRY = 'retry',
  ERROR = 'error',
}