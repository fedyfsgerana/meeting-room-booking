import { Card, CardBody } from "@/frontend/components/ui/card";
import { PageHead } from "@/frontend/components/ui/page-head";

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <>
      <PageHead title={title} description={description} />
      <Card>
        <CardBody>Isi halaman ini dibuat di bagian berikutnya.</CardBody>
      </Card>
    </>
  );
}
