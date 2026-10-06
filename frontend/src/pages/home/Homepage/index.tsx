import { useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import CategoryNav from "@/components/CategoryNav";

const Homepage = () => {
  const [selectedSlug, setSelectedSlug] = useState("");

  return (
    <PageWrapper>
      <div className="component:Homepage space-y-6">
        <CategoryNav selectedSlug={selectedSlug} onSelectCategory={setSelectedSlug} />
        <p className="text-sm text-muted-foreground">
          Danh sách sản phẩm sẽ hiển thị tại đây (US-PRD-002).
        </p>
      </div>
    </PageWrapper>
  );
};

export default Homepage;
