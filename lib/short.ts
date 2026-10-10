// One-line headlines for cards and lists (item 3 of the Karandeep walkthrough audit).
// Each line is shortened from the stored brief headline and adds no new fact; the full headline stays inside the brief.
const SHORT: Record<string, string> = {
  finserve_capital_mutual_nda: "Not a mutual NDA: adds a 12-month non-compete, a 24-month no-hire and an uncapped one-way indemnity.",
  harrington_health_baa: "Unsigned BAA bans offshore access, uncaps privacy liability and asks for $5M cyber insurance against $1M held.",
  harrington_health_msa: "$4,200 a day in uncapped delay damages and unlimited liability, on top of a BAA nobody has signed.",
  marcus_reed_contractor_agreement: "India freelancer template reused for a US individual: non-compete, 24-hour termination, fees paid in rupees.",
  lakeshore_grocers_msa: "Rate card is below the signed Crestline rates, and Crestline's most-favoured-customer clause may apply.",
  blueorchid_hotels_pilot_agreement: "3 of the 12 pilot hotels are in the GCC: a possible conflict with the Al Noor restriction, for counsel.",
  daniel_ortiz_contractor_agreement: "Fair freelancer agreement, but no HIPAA flow-down and it starts 5 Oct on Harrington patient-data work.",
  kriti_data_labs_subcontractor_agreement: "AtliQ's own template turned on a vendor: 2% a day uncapped delay damages, 120-day payment, no data-protection terms.",
  sunrise_foods_sow2: "Lines up with the signed Sunrise MSA with nothing outside the checklist; SOW-1 is not on file.",
  gulf_crown_hotels_msa: "All nine hotels are in Saudi Arabia, which the Al Noor contract bars until about Sep 2029; the Seaside waiver does not cover it.",
  datavane_strategic_partnership_agreement: "Would make AtliQ a partner for a competing platform while the CloudSpan exclusivity still runs, plus an uncapped one-way indemnity.",
  rheinwerk_analytics_services_agreement: "Mostly inside usual positions, but asks AtliQ to warrant it owns PipeKit, which Northwind appears to hold; two annexes are missing.",
  daniel_ortiz_nda: "Genuinely mutual and clean, but says nothing about patient data and cannot replace the BAA flow-down.",
  loopmart_mutual_nda: "Genuinely mutual NDA with Indian law and a 2-year term; only three minor points worth knowing.",
  travelhub_services_agreement: "Names the US entity for a Dubai customer while the invoice clause names the Indian one; the hotel-ranking module needs a counsel look.",
};
export const shortHeadline = (slug: string, full: string) => SHORT[slug] ?? full;
