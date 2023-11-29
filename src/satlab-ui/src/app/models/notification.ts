import {v4 as uuidv4} from 'uuid';

export interface INotification {
  id: string;
  type: 'info' | 'error';
  message: NotificationNodes;
}

export type NotificationNodes =
  | IStringNode
  | IURLNode
  | string
  | (string | IURLNode | IStringNode)[];

export interface IURLNode {
  type: 'url';
  url: string;
}

export interface IStringNode {
  type: 'string';
  value: string;
}

export function createNotification(
  message: NotificationNodes,
  type: INotification['type']
): INotification {
  return {
    id: uuidv4(),
    type: type,
    message: message,
  };
}
