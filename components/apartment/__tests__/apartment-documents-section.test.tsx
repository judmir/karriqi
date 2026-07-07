import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ApartmentDocumentsSection } from "@/components/apartment/apartment-documents-section";
import {
  APARTMENT_DOCUMENT_CATEGORIES,
  APARTMENT_EXPECTED_DOCUMENTS,
} from "@/lib/apartment/cicerostrasse-we28-data";

describe("ApartmentDocumentsSection", () => {
  it("renders every document category", () => {
    render(<ApartmentDocumentsSection />);
    for (const category of APARTMENT_DOCUMENT_CATEGORIES) {
      expect(screen.getByText(category.title)).toBeInTheDocument();
    }
  });

  it("marks financing folders as sensitive", () => {
    render(<ApartmentDocumentsSection />);
    expect(screen.getAllByText("Sensitive — offline only").length).toBe(2);
  });

  it("lists documents still expected later", () => {
    render(<ApartmentDocumentsSection />);
    expect(screen.getByText("Still expected later")).toBeInTheDocument();
    for (const doc of APARTMENT_EXPECTED_DOCUMENTS) {
      expect(screen.getByText(doc)).toBeInTheDocument();
    }
  });
});
