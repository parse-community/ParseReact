declare class ParseQuery {
  objectClass: any;
  className: string;

  _where: { [key: string]: any };
  _include: Array<string>;
  _limit: number;
  _skip: number;
  _order: ?Array<string>;

  get: (objectId: string, options?: any) => Promise;
  find: (options?: any) => Promise;
}