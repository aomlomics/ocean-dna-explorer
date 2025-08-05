import ExplorePage from '@/app/components/explore/ExplorePage';
import { Metadata } from 'next';
import Table from '@/app/components/paginated/Table';
import ExploreTabButtons from '@/app/components/explore/ExploreTabButtons';
import Link from 'next/link';
import Pagination from '@/app/components/paginated/Pagination';

export const metadata: Metadata = {
  title: 'Explore Occurrences',
};

const Page = async () => {
  return (
    <ExplorePage table="occurrence" tableConfig={[]}>
      <div className="px-6 lg:px-0">
        <div className="space-y-4">
          <ExploreTabButtons />
          <div className="bg-base-100 border border-base-300 rounded-lg p-4">
            <p className="mb-2">
              Individual detection records linking samples to specific DNA sequences (Features), including their quantified abundance.
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
            Showing <span className="text-primary">Occurrences</span>
          </h1>
        </div>
        <div className="aspect-5/2 hidden lg:block">
          <div className="rounded-lg border border-base-300 h-full">
            <Table table="occurrence" defaultTake={50} />
          </div>
        </div>
        <div className="lg:hidden">
          <Pagination table="occurrence" />
        </div>
      </div>
    </ExplorePage>
  );
};

export default Page; 