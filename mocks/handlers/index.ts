import { authHandlers }         from './auth';
import { oauthHandlers }        from './oauth';
import { productHandlers }      from './products';
import { userHandlers }         from './users';
import { wishlistHandlers }     from './wishlist';
import { sellerHandlers }       from './sellers';
import { orderHandlers }        from './orders';
import { notificationHandlers } from './notifications';

export const handlers = [
  ...authHandlers,
  ...oauthHandlers,
  ...productHandlers,
  ...userHandlers,
  ...wishlistHandlers,
  ...sellerHandlers,
  ...orderHandlers,
  ...notificationHandlers,
];
