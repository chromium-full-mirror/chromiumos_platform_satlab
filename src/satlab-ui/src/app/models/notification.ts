import { v4 as uuidv4 } from 'uuid';

export interface INotification {
  id: string;
  type: 'info' | 'error' | 'warning'
  message: string;
}

export function createNotification(message: string, type: INotification['type']): INotification {
  return {
    id: uuidv4(),
    type: type,
    message: message,
  }
}
