import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Link href="/dashboard">
        <a>Dashboard</a>
      </Link>
      <Link href="/projects">
        <a>Projects</a>
      </Link>
      <Link href="/tasks">
        <a>Tasks</a>
      </Link>
      <Link href="/team">
        <a>Team</a>
      </Link>
    </div>
  );
}
