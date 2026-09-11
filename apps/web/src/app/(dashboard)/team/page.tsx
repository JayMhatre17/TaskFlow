import TeamFilters from "@/components/teams/TeamFilters";
import TeamHeader from "@/components/teams/TeamHeader";
import TeamPagination from "@/components/teams/TeamPagination";
import TeamTable from "@/components/teams/TeamTable";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <TeamHeader />
      <TeamFilters />
      <TeamTable />
      <TeamPagination />
    </div>
  );
}
