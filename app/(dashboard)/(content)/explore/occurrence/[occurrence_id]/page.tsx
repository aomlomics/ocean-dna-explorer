import DataDisplay from '@/app/components/DataDisplay';
import { prisma } from '@/app/helpers/prisma';
import { Metadata } from 'next';

type Props = {
  params: {
    occurrence_id: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Occurrence ${params.occurrence_id}`,
  };
}

const Page = async ({ params }: Props) => {
  const occurrence = await prisma.occurrence.findUnique({
    where: {
      id: parseInt(params.occurrence_id),
    },
  });

  if (!occurrence) {
    return <div>Occurrence not found</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Occurrence: {occurrence.id}</h1>
      <DataDisplay
        data={occurrence}
        table="occurrence"
      />
    </div>
  );
};

export default Page; 