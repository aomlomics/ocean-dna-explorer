![Ocean DNA Explorer Banner](public/images/banner_ode.png)

[![NODE CI/CD workflow](https://github.com/aomlomics/node/actions/workflows/testAndDeploy.yml/badge.svg)](https://github.com/aomlomics/node/actions/workflows/testAndDeploy.yml)

## Development Workflow

For feature requests, please raise a GitHub issue. To propose a change:

- Feature branches must be made from **dev** branch [↓ See Development Process](#development-process)

## Quick Start

### Install Node.js and npm

Install the 

### Install Dependencies

This will only show you the site with no data. You need to setup a local Postgres Database, OR visit the dev or main website to see the website's full functionality.

After cloning the repository locally:

```bash
npm install --ignore-scripts
npm run generate
npx prisma db push
npm run dev
```

### Configure .env File

- You need to create an environment file named .env.
- This file is required to configure environment variables for the application.
- **See [.env.template](/.env.template) to see the required variables and their format.**
- In the POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING variables, replace `<username>`, `<password>`, `<server>`, and `<db name>` with your own.

## Local Database Setup / Commands

1. Install [Postgres](https://www.postgresql.org/download/)
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

### Database Commands

1. First Time Setup (Fresh Install):

```bash
npx prisma generate	# Creates Prisma Client based on your schema
npx prisma db push	# Creates database tables based on schema
```

2. Schema Changes (Keep Data):

```bash
npx prisma db push	# Updates database schema while preserving existing data
					# Will fail if changes would cause data loss
```

3. Schema Changes (Can't Keep Data):

```bash
npx prisma db push --force-reset	# Completely resets database, deleting all data
									# Must reseed database from admin panel. If you need to be added as an admin, contact a maintainer

```

**Important: To populate the local database, you must upload the files from [ODE_testdata](https://github.com/aomlomics/ODE_testdata) by navigating to the `Submit` tab on the website.** Then click `Submit a Project`.

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

Push schema changes to database:

```bash
npx prisma migrate dev --name "<insert migration name>" --create-only
```

Pull schema changes from database:

```bash
npx prisma db pull
```

Clear the database of all entries:

```bash
npx prisma db push --force-reset
```

Generate Prisma Client:

```bash
npm run generate
```

## Disclaimer

This repository is a scientific product and is not official communication of the National Oceanic and Atmospheric Administration, or the United States Department of Commerce. All NOAA GitHub project code is provided on an 'as is' basis and the user assumes responsibility for its use. Any claims against the Department of Commerce or Department of Commerce bureaus stemming from the use of this GitHub project will be governed by all applicable Federal law. Any reference to specific commercial products, processes, or services by service mark, trademark, manufacturer, or otherwise, does not constitute or imply their endorsement, recommendation or favoring by the Department of Commerce. The Department of Commerce seal and logo, or the seal and logo of a DOC bureau, shall not be used in any manner to imply endorsement of any commercial product or activity by DOC or the United States Government.
