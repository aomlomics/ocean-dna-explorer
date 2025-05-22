# node

[![NODE CI/CD workflow](https://github.com/aomlomics/node/actions/workflows/testAndDeploy.yml/badge.svg)](https://github.com/aomlomics/node/actions/workflows/testAndDeploy.yml)

## Development Workflow

For feature requests, please raise a GitHub issue. To propose a change:

- Feature branches must be made from **dev** branch [↓ See Development Process](#development-process)

## Quick Start

### Install Dependencies

This will only show you the frontend (with no data). You need to setup a local Postgres Database, OR visit the dev or main website to see the website's full functionality.

After cloning the repository locally:

```bash
cd frontend
npm install --ignore-scripts
npm run dev
```

Note: npm install will fail until you do the Local DB setup. You can view the frontend, but it won't have data and won't be very interesting/useful.

### Configure .env File

- You need to create an environment file named .env in the `/frontend` directory.
- This file is required to configure environment variables for the application.
- **See `/frontend/.env.template` to see the required variables and their format.**

## Local Database Setup / Commands

1. Install Postgres DB via [Prisma Postgres guide](https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database)
   - Follow instructions per your system, use default parameters
   - Note your postgres username and password. We recommend username: postgres, password: admin.
2. Create your database using either:

   ```bash
   # In terminal:
   createdb <dbname>

   # Or in psql:
   CREATE DATABASE <dbname>;
   ```

3. To view all local databases in psql:
   ```sql
   \l
   ```
4. Configure your .ENV file. **Please see our Env file section above for more info**:
   - For the local database: `DATABASE_URL=postgres://<username>:<password>@localhost/<database_name>?pgbouncer=true&connect_timeout=15`
   - Replace `<username>`, `<password>`, and `<database_name>` with your own.

### Database Commands

Note: All commands must be executed from within `/frontend`.

1. First Time Setup (Fresh Install):

```bash
npx prisma generate        # Creates Prisma Client based on your schema
npx prisma db push        # Creates database tables based on schema
```

2. Schema Changes (Keep Data):

```bash
npx prisma db push        # Updates database schema while preserving existing data
                         # Will fail if changes would cause data loss
```

3. Schema Changes (Can't Keep Data):

```bash
npx prisma db push --force-reset  # Completely resets database, deleting all data
npx prisma db seed               # Re-adds seed data if needed
```

**Important: To populate the local database, you must upload the files in `/testdata` by navigating to the `Submit` tab on the website.** Then click `Submit a Project`.

## Development Process

Feature branches must be made from **dev** branch. Get latest from dev:

```bash
# If you don't have a dev branch yet locally:
git checkout -b dev origin/dev

# If you intend to make a change:
git checkout -b <FeatureBranchName>
git merge dev
```

## Developer Commands

All commands must be executed from within `/frontend`:

Install all node dependencies from package.json:

```bash
npm install --ignore-scripts
```

Run the local test server:

```bash
npm run dev
```

Open the Prisma database view:

```bash
npx prisma studio
```

Push schema changes to database (all database migrations should be done in `/frontend`):

```bash
npx prisma migrate dev --name "<insert migration name>"
```

Pull schema changes from database (must be done in `/server` after creating a migration in `/frontend`):

```bash
npx prisma db pull
```

Clear the database of all entries:

```bash
npx prisma db push --force-reset
```

Generate Prisma Client:

```bash
npx prisma generate
```

To create an Entity Relationship Diagram (ERD) for the current version of the database, copy and paste the contents of the schema.dbml file in `frontend/prisma/dbml` to: [DB Diagram](https://dbdiagram.io/d)

## Legacy Documentation

The following sections are no longer in use but maintained for reference:

### To run using Docker:

Build the image and run the image in a container using

```bash
docker build -t node -f server/Dockerfile.dev .; docker run -t -d -p 8080:8080 --name node node
```

This will open our remote server at `localhost:8080`. After running this once, you can use Docker Desktop to manage the container.

To delete the container and image, use

```bash
docker rm --force node; docker rmi node
```

To open the container in VSCode, open the Command Pallette `ctrl + shift + p` and run `Dev Containers: Attach to Running Container` (this requires the Dev Containers extension).

Open the folder `/app/node/server` in the Dev Container.

When opening the first time, VSCode will think every file has been changed (potentially line-termination inconsistencies, not sure). Discard all git changes before starting any work. You should only have to do this once after creating the container.

### Server

The server must be handled inside the Docker container.

To reattach your terminal to the gunicorn process, use

```bash
screen -rd nodeserver
```

To scroll inside the screen (enter copy mode), hit `ctrl+a`, then hit `esc`. When you are in copy mode, you can't see new logs. So, once you are done looking, hit `ctrl+c` to exit copy mode. To detach, hit `ctrl+a`, then hit `d`.

There are helpful `.sh` scripts you can run with the `bash` command in `server/scripts`.
The `restart.sh` script will restart the gunicorn process to allow you to view changes to code.
The `start.sh` script will run the gunicorn process in a screen. Behavior is the same as when you run `attach.sh`.

## Disclaimer

This repository is a scientific product and is not official communication of the National Oceanic and Atmospheric Administration, or the United States Department of Commerce. All NOAA GitHub project code is provided on an 'as is' basis and the user assumes responsibility for its use. Any claims against the Department of Commerce or Department of Commerce bureaus stemming from the use of this GitHub project will be governed by all applicable Federal law. Any reference to specific commercial products, processes, or services by service mark, trademark, manufacturer, or otherwise, does not constitute or imply their endorsement, recommendation or favoring by the Department of Commerce. The Department of Commerce seal and logo, or the seal and logo of a DOC bureau, shall not be used in any manner to imply endorsement of any commercial product or activity by DOC or the United States Government.
