declare class ParseObject {
  className: string;
  objectId: string;

  get: (attr: string) => any;
}
