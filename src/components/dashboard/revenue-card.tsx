import React from "react";
// Icons
import { Stethoscope, User2, CalendarDays, Activity } from "lucide-react";

interface DoctorCardProps {
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  totalAppointments: number;
}

const DoctorCards: React.FC<DoctorCardProps> = ({
  totalDoctors,
  activeDoctors,
  totalPatients,
  totalAppointments,
}) => {
  const CardDetails = [
    {
      title: "Total Doctors",
      icon: <Stethoscope className="text-primary" size={22} />,
      data: `${totalDoctors}`,
      description: "+5 new this month",
    },
    {
      title: "Active Doctors",
      icon: <Activity className="text-primary" size={22} />,
      data: `${activeDoctors}`,
      description: "Currently available",
    },
    {
      title: "Total Patients",
      icon: <User2 className="text-primary" size={22} />,
      data: `${totalPatients}`,
      description: "+200 this month",
    },
    {
      title: "Total Appointments",
      icon: <CalendarDays className="text-primary" size={22} />,
      data: `${totalAppointments}`,
      description: "This month",
    },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 pt-2 w-full">
      <div className="grid grid-flow-row md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        {CardDetails.map((items, index) => (
          <div key={index} className="border border-gray-200 p-5 rounded-xl shadow" >
            <div className="mb-4 flex items-center justify-between " >
              <h1 className="text-xl font-medium text-muted-foreground" >{items.title}</h1>
              {items.icon}
            </div>
            <div className="text-3xl font-extrabold" >
                {items.data}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorCards;
