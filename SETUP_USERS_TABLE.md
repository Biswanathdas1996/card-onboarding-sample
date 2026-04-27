# User Management Setup Instructions

## Database Migration

To enable the User Management feature, you need to run the database migration to create the `users` table.

### Option 1: Using psql command line

```bash
psql -U neondb_owner -d neondb -f db/migrations/add_users_table.sql
```

### Option 2: Manual execution

Connect to your PostgreSQL database and run the SQL from `db/migrations/add_users_table.sql`

### Option 3: Using your database client

Copy the contents of `db/migrations/add_users_table.sql` and execute it in your database client (pgAdmin, DBeaver, etc.)

## Accessing the User Management Page

Once the database migration is complete:

1. Start the backend server:
   ```bash
   node server.js
   ```

2. Start the React frontend:
   ```bash
   npm start
   ```

3. Navigate to the User Management page:
   - Click on "Users" in the top navigation bar
   - Or directly visit: http://localhost:3000/users

## Features

- **Add Users**: Form to add new users with name, date of birth, and address
- **View Users**: Table displaying all added users with their details
- **Real-time Updates**: Table refreshes automatically after adding new users
- **Responsive Design**: Works on all device sizes

## API Endpoints

The following API endpoints are available:

- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user by ID
- `DELETE /api/users/:id` - Delete a user

## Testing

You can test the API endpoints using curl:

```bash
# Create a user
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","dateOfBirth":"1990-01-15","address":"123 Main St, New York"}'

# Get all users
curl http://localhost:5000/api/users
```
