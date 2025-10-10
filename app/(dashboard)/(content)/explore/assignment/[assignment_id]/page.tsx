import DataDisplay from '@/app/components/DataDisplay';
import { prisma } from '@/app/helpers/prisma';
import { Metadata } from 'next';

type Props = {
  params: Promise<{
    assignment_id: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { assignment_id } = await params;
  return {
    title: `Assignment ${assignment_id}`,
  };
}

const Page = async ({ params }: Props) => {
  const { assignment_id } = await params;
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: parseInt(assignment_id),
    },
  });

  if (!assignment) {
    return <div>Assignment not found</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Assignment: {assignment.id}</h1>
      <DataDisplay
        data={assignment}
        table="assignment"
      />
    </div>
  );
};

export default Page; 