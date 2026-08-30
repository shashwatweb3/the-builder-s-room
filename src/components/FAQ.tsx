import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OffsetCard } from "./OffsetCard";

export interface FAQItem {
  q: string;
  a: string;
}

export function FAQ({ items }: { items: FAQItem[] }) {
  return (
    <OffsetCard className="overflow-hidden p-2 sm:p-4">
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem
            key={item.q}
            value={`item-${i}`}
            className="border-b-2 border-border last:border-b-0"
          >
            <AccordionTrigger className="px-3 text-left text-lg font-bold hover:no-underline sm:text-xl">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="px-3 text-base text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </OffsetCard>
  );
}
