import DataDisplay from '@/app/components/DataDisplay';
import { prisma } from '@/app/helpers/prisma';
import { Metadata } from 'next';

type Props = {
  params: {
    assignment_id: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Assignment ${params.assignment_id}`,
  };
}

const Page = async ({ params }: Props) => {
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: parseInt(params.assignment_id),
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