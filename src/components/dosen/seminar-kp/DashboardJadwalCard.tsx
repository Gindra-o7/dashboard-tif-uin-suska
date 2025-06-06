import { type FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// Interface untuk data seminar
interface Seminar {
  id: number;
  namaMahasiswa: string;
  ruangan: string;
  jam: string;
  tanggalSeminar: string;
  dosenPenguji: string;
  status: "terjadwal" | "selesai" | "diganti";
}

interface DashboardCardsProps {
  seminars: Seminar[];
}

const DashboardJadwalCard: FC<DashboardCardsProps> = ({ seminars }) => {
  // Calculate statistics for dashboard cards
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  const totalSeminars = seminars.length;

  const seminarsThisWeek = seminars.filter((seminar) => {
    const seminarDate = new Date(seminar.tanggalSeminar);
    return (
      seminarDate >= thisWeekStart &&
      seminarDate <= new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    );
  }).length;

  // const completedSeminars = seminars.filter(
  //   (seminar) => seminar.status === "selesai"
  // ).length;

  const rescheduledSeminars = seminars.filter(
    (seminar) => seminar.status === "diganti"
  ).length;

  // const completionPercentage = totalSeminars
  //   ? Math.round((completedSeminars / totalSeminars) * 100)
  //   : 0;

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300 } },
  };

  return (
    <motion.div
      className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Total Seminar Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium text-blue-800 dark:text-blue-300">
              Total Seminar
            </CardTitle>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="bg-blue-200 p-2 rounded-full dark:bg-blue-800"
            >
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="text-5xl font-bold text-blue-800 dark:text-white"
            >
              {totalSeminars}
            </motion.div>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Seminar Terjadwal
            </p>
            <div className="h-2 w-full bg-blue-100 dark:bg-blue-900 rounded-full mt-3">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-2 bg-blue-500 rounded-full"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Seminar Minggu Ini Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium text-green-800 dark:text-green-300">
              Seminar Minggu Ini
            </CardTitle>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="bg-green-200 p-2 rounded-full dark:bg-green-800"
            >
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="text-5xl font-bold text-green-800 dark:text-white"
            >
              {seminarsThisWeek}
            </motion.div>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
              Seminar Terjadwal
            </p>
            <div className="h-2 w-full bg-green-100 dark:bg-green-900 rounded-full mt-3">
              <motion.div
                initial={{ width: "0%" }}
                animate={{
                  width: `${(seminarsThisWeek / totalSeminars) * 100}%`,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-2 bg-green-500 rounded-full"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Jadwal Diganti Card */}
      <motion.div variants={item}>
        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-medium text-amber-800 dark:text-amber-300">
              Jadwal Diganti
            </CardTitle>
            <motion.div
              whileHover={{ rotate: 15 }}
              className="bg-amber-200 p-2 rounded-full dark:bg-amber-800"
            >
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="text-5xl font-bold text-amber-800 dark:text-white"
            >
              {rescheduledSeminars}
            </motion.div>
            <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
              Seminar Dijadwal Ulang
            </p>
            <div className="h-2 w-full bg-amber-100 dark:bg-amber-900 rounded-full mt-3">
              <motion.div
                initial={{ width: "0%" }}
                animate={{
                  width: `${(rescheduledSeminars / totalSeminars) * 100}%`,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-2 bg-amber-500 rounded-full"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DashboardJadwalCard;
