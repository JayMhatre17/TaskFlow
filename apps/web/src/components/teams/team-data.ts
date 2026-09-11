export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Developer" | "Designer";
  status: "Active" | "Inactive";
  projects: number;
};

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "Admin",
    status: "Active",
    projects: 4,
  },
  {
    id: "2",
    name: "Sarah Smith",
    email: "sarah@example.com",
    role: "Manager",
    status: "Active",
    projects: 3,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "Developer",
    status: "Active",
    projects: 2,
  },
  {
    id: "4",
    name: "Emily Brown",
    email: "emily@example.com",
    role: "Designer",
    status: "Inactive",
    projects: 1,
  },
];
