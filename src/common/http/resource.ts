/**
 * Laravel-style API Resource. Wrap a transform function to get both a single
 * and a collection formatter that shape models into response payloads.
 *
 *   const UserResource = makeResource<UserDocument, UserResponse>((u) => ({ ... }));
 *   UserResource.item(user);          // single
 *   UserResource.collection(users);   // array
 */
export type ResourceTransformer<T, R> = (item: T) => R;

export interface Resource<T, R> {
  item(item: T): R;
  collection(items: T[]): R[];
}

export function makeResource<T, R>(transform: ResourceTransformer<T, R>): Resource<T, R> {
  return {
    item: (item) => transform(item),
    collection: (items) => items.map(transform),
  };
}
