import { authHandlers }         from './auth';
import { oauthHandlers }        from './oauth';
import { productHandlers }      from './products';
import { userHandlers }         from './users';
import { wishlistHandlers }     from './wishlist';
import { sellerHandlers }       from './sellers';
import { orderHandlers }        from './orders';
import { paymentHandlers }      from './payments';
import { notificationHandlers } from './notifications';
import { adminHandlers }        from './admin';

export const handlers = [
  ...authHandlers,
  ...oauthHandlers,
  ...productHandlers,
  ...userHandlers,
  ...wishlistHandlers,
  ...sellerHandlers,
  ...orderHandlers,
  ...paymentHandlers,
  ...notificationHandlers,
  ...adminHandlers,
];
