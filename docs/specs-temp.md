church app

- records tithes, offerings, mission giving, first fruit and other commitments for certain events
- doesnt record spending or any other outgoing financial transactions
- multi tenant (super admin, admin, users)

- super admin 
  - can invite admins through email

- admin 
  - can create(temp user), manage and invite(for linking or create then link) members(users)
  - can create and manage events
  - can create and manage incoming transactions
  
- users
  - can only view events
  - can only view their own transactions

- admin can record a transaction without a user
- when an admin creates a user so that transaction is linked to it, no user can access(view) unless they're invited to be linked to that user account through email
- we'll use google SSO, invitation also uses email and google SSO
- we'll use firebase for authentication and database
- we'll use free email service (needs research)

- nextjs
- tailwind
- rtk query

- for the api layer, we need an abstraction so that we can easily switch to another database in the future (probably postgres)
- for now we'll utilize nextjs headless api, but later we will migrate to standalone server, so abstraction is needed