import ExplorePage from '@/app/components/explore/ExplorePage';
import { Metadata } from 'next';
import Table from '@/app/components/paginated/Table';
import ExploreTabButtons from '@/app/components/explore/ExploreTabButtons';
import Link from 'next/link';
import Pagination from '@/app/components/paginated/Pagination';

export const metadata: Metadata = {
  title: 'Explore Assignments',
};

const Page = async () => {
  return (
    <ExplorePage table="assignment" tableConfig={[]}>
      <div className="px-6 lg:px-0">
        <div className="space-y-4">
          <ExploreTabButtons />
          <div className="bg-base-100 border border-base-300 rounded-lg p-4">
            <p className="mb-2">
              Taxonomic assignments for each DNA sequence (Feature), including the confidence of the assignment.
            </p>
            <p className="text-sm">
              For more detailed information, visit our{" "}
              <Link href="/help" className="text-primary hover:underline">
                Help page
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center my-4">
          <h1 className="text-xl font-medium text-base-content">
            Showing <span className="text-primary">Assignments</span>
          </h1>
        </div>
        <div className="aspect-5/2 hidden lg:block">
          <div className="rounded-lg border border-base-300 h-full">
            <Table table="assignment" defaultTake={50} />
          </div>
        </div>
        <div className="lg:hidden">
          <Pagination table="assignment" />
        </div>
      </div>
    </ExplorePage>
  );
};

export default Page; 