import ExplorePage from '@/app/components/explore/ExplorePage';
import { Metadata } from 'next';
import ExploreTabButtons from '@/app/components/explore/ExploreTabButtons';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Explore Assignments',
};

const Page = async () => {
  return (
    <ExplorePage table="assignment" tableConfig={[]} title="Assignments">
      <div className="w-full space-y-4">
        <div className="text-base-content/80 pb-4 space-y-2">
          <p>
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
        <ExploreTabButtons />
      </div>
    </ExplorePage>
  );
};

export default Page; 