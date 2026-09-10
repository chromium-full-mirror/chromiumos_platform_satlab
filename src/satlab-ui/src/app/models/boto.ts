export interface IBoto {
  key: string;
  secret: string;
  bucket: string;
  userEmail?: string;
  isUserAuthenticated?: boolean;
}
