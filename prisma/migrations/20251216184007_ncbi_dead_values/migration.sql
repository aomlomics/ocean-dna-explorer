-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeadBoolean" ADD VALUE 'missing';
ALTER TYPE "DeadBoolean" ADD VALUE 'not collected';
ALTER TYPE "DeadBoolean" ADD VALUE 'not provided';
ALTER TYPE "DeadBoolean" ADD VALUE 'restricted access';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: control sample';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: sample group';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: synthetic construct';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: lab stock';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: third party data';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: data agreement established pre-2023';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: endangered species';
ALTER TYPE "DeadBoolean" ADD VALUE 'missing: human-identifiable';
