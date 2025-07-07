import { FC, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { PartyPopper, Calendar, Clock, LayoutGridIcon, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Stepper from "@/components/mahasiswa/seminar/stepper";
import InfoCard from "../informasi-seminar";
import DocumentCard from "../formulir-dokumen";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import APISeminarKP from "@/services/api/mahasiswa/seminar-kp.service";

// Types
interface Step3Props {
  activeStep: number;
}

interface CardHeaderProps {
  title: string;
}

interface DocumentInfo {
  title: string;
  status: DocumentStatus;
  notes?: string;
  link?: string;
}

type DocumentStatus = "default" | "Terkirim" | "Divalidasi" | "Ditolak";

// Constants
const SEMINAR_REQUIREMENTS = [
  "Hubungi Dosen Pembimbing dan Dosen Penguji Terkait Seminar dan Jadwal (Konfirmasi)",
  "Serahkan Dokumen Seminar KP : Printed dan Soft File (Via Telegram) Daily Report, Laporan Tambahan dan Undangan Seminar KP Kepada Dosen Pembimbing dan Penguji KP Maksimal 3 Hari SEBELUM Seminar KP",
  "Persiapkan Infokus dll ketika seminar pada Hari H",
  "Konfirmasi ke Koordinator KP jika ada kendala dll",
  "Menyiapkan form Berita Acara dan Lembar Pengesahan KP",
];

const DOCUMENTS = ["Dokumen Surat Undangan Seminar Kerja Praktik"];

// Pemetaan title ke jenis_dokumen API
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  "Dokumen Surat Undangan Seminar Kerja Praktik": "SURAT_UNDANGAN_SEMINAR_KP",
};

// Pemetaan title dokumen ke URL
const DOCUMENT_URLS: Record<string, string> = {
  "Dokumen Surat Undangan Seminar Kerja Praktik": "/seminar-kp/dokumen/surat-undangan-seminar-kp",
};

// Component for gradient card header
const CardHeaderGradient: FC<CardHeaderProps> = ({ title }) => (
  <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-4">
    <CardTitle className="text-white text-lg font-medium">{title}</CardTitle>
  </div>
);

// Form actions component for reuse
const FormActions: FC<{
  onReset?: () => void;
  onSubmit?: () => void;
  disabledReset?: boolean;
}> = ({ onReset, onSubmit, disabledReset }) => (
  <div className="flex justify-end mt-5">
    <div className="flex gap-3">
      <Button variant="outline" className="border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2" onClick={onReset} disabled={disabledReset}>
        <RefreshCw className="h-4 w-4" />
        Kosongkan Formulir
      </Button>
      <Button className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white border-none shadow-sm hover:shadow" onClick={onSubmit}>
        Kirim
      </Button>
    </div>
  </div>
);

// Document form component
const DocumentForm: FC<{
  documents: DocumentInfo[];
  showHeader?: boolean;
  showActions?: boolean;
  onReset?: () => void;
  onSubmit?: () => void;
  onLinkChange?: (index: number, value: string) => void;
}> = ({ documents, showHeader = true, showActions = true, onReset, onSubmit, onLinkChange }) => (
  <>
    <Card className="border dark:border-none shadow-sm rounded-lg overflow-hidden dark:bg-gray-900">
      {showHeader && <CardHeaderGradient title="Silakan isi formulir di bawah ini untuk divalidasi!" />}
      <CardContent className="p-5 flex flex-col gap-5">
        {documents.map((doc, index) => (
          <DocumentCard key={doc.title} judulDokumen={doc.title} status={doc.status} catatan={doc.notes} link={doc.link} onLinkChange={(value) => onLinkChange && onLinkChange(index, value)} />
        ))}
      </CardContent>
    </Card>
    {showActions && <FormActions onReset={onReset} onSubmit={onSubmit} disabledReset={documents.every((doc) => doc.status !== "default" && doc.status !== "Ditolak")} />}
  </>
);

// Decorative particles component
const BackgroundParticles: FC = () => (
  <motion.div className="absolute top-0 left-0 w-full h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-white/30"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 2 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </motion.div>
);

// Animated clock component
const AnimatedClock: FC = () => (
  <div className="relative flex justify-center">
    <div className="size-16 rounded-full flex items-center justify-center mb-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Clock className="w-10 h-10 text-white drop-shadow-md" />
      </motion.div>
    </div>
  </div>
);

// CountdownCard component
const CountdownCard: FC<{
  countdownDays: number;
  isToday: boolean;
  isPast: boolean;
}> = ({ countdownDays, isToday, isPast }) => {
  const todayBgClass = "from-purple-500 to-violet-600 dark:from-purple-600 dark:to-violet-700";
  const countdownBgClass = "from-emerald-400 to-teal-600 dark:from-emerald-500 dark:to-teal-700";
  const pastBgClass = "from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700";
  const bgClass = isPast ? pastBgClass : isToday ? todayBgClass : countdownBgClass;

  return (
    <motion.div className="h-56 w-56 lg:h-auto flex-shrink-0" transition={{ type: "spring", stiffness: 300 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${bgClass} rounded-xl p-6 text-center flex flex-col justify-center items-center transform-gpu shadow-lg`}>
        <BackgroundParticles />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <AnimatedClock />
        <h2 className={`font-bold text-white mt-3 drop-shadow-lg ${isToday ? "text-4xl" : "text-6xl"}`}>{isPast ? "Telah Lewat" : isToday ? "Hari Ini" : `H-${countdownDays}`}</h2>
        <motion.div className="absolute w-32 h-12 rounded-full bg-white/10 blur-md" style={{ top: "60%" }} animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
        <span className="relative text-xs text-emerald-100 uppercase tracking-wider font-medium mt-3 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          {isPast ? "SEMINAR" : isToday ? "SEMINAR" : "MENUJU SEMINAR"}
        </span>
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
      </div>
    </motion.div>
  );
};

// AnnouncementCard component
const AnnouncementCard: FC = () => (
  <motion.div className="flex-1 rounded-xl overflow-hidden relative border border-gray-100 dark:border-none bg-white dark:bg-black min-h-56" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 dark:from-purple-600/20 dark:via-transparent via-transparent to-purple-100/60 dark:to-blue-600/20"></div>
    <motion.div className="absolute -top-4 -left-4 w-16 h-16 rounded-full bg-blue-400/20 dark:bg-purple-500/30 blur-md" animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} />
    <motion.div className="absolute top-1/2 -right-4 w-12 h-12 rounded-full bg-purple-400/20 dark:bg-blue-500/30 blur-md" animate={{ y: [0, 10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }} />
    <motion.div className="absolute bottom-6 left-10 w-8 h-8 rounded-full bg-pink-400/20 dark:bg-pink-500/30 blur-md" animate={{ x: [0, 10, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} />
    <motion.div className="absolute top-1/4 right-1/4 w-24 h-24 rounded-full bg-indigo-400/10 dark:bg-indigo-500/20 blur-xl" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} />
    <motion.div className="absolute bottom-1/3 right-1/5 w-16 h-16 rounded-full bg-blue-400/10 dark:bg-blue-500/20 blur-lg" animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }} />
    <div className="relative h-full p-6 sm:p-8 flex flex-col justify-center">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100/80 text-blue-700 hover:bg-blue-200/80 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 backdrop-blur-sm">Seminar-KP</Badge>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 dark:from-purple-500 to-transparent rounded-full"></div>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "linear",
          }}
          className="relative"
        >
          <PartyPopper className="w-8 h-8 text-blue-500 dark:text-pink-300" strokeWidth={1.5} />
          <motion.div className="absolute inset-0 bg-blue-400/20 dark:bg-pink-300/20 rounded-full blur-md" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
        </motion.div>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-4 text-gray-800 dark:text-white">
        <span className="text-blue-600 dark:text-purple-300">Semoga Sukses Dalam</span>{" "}
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-pink-300 dark:to-blue-300">Pelaksanaan Seminar! ✨</span>
      </h1>
      <div className="bg-blue-50 dark:bg-white/10 backdrop-blur-sm rounded-xl p-3 mt-2 max-w-xl border border-blue-100 dark:border-transparent">
        <p className="text-gray-700 dark:text-white/80 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          Jadwal & informasi Dosen Penguji Anda sudah siap
        </p>
      </div>
      <div className="w-24 h-1 bg-gradient-to-l from-blue-500 dark:from-purple-500 to-transparent rounded-full self-end"></div>
    </div>
  </motion.div>
);

// Requirements list component
const RequirementsList: FC = () => (
  <Card className="border dark:border-none shadow-sm rounded-lg overflow-hidden dark:bg-gray-900">
    <CardHeaderGradient title="Sebelum Seminar KP Mahasiswa Wajib Sudah:" />
    <CardContent className="p-4 sm:p-5">
      <ol className="space-y-2 text-sm sm:text-base">
        {SEMINAR_REQUIREMENTS.map((text, index) => (
          <li key={index} className="flex items-start gap-3 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-200 transition-colors duration-200">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-emerald-400/30 dark:bg-emerald-800/50 rounded-md font-semibold text-emerald-700 dark:text-emerald-300 text-sm">{index + 1}</div>
            <div className="flex-1 text-gray-700 dark:text-gray-200 text-base">{text}</div>
          </li>
        ))}
      </ol>
    </CardContent>
  </Card>
);

// Main component
const Step3: FC<Step3Props> = ({ activeStep }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formDocuments, setFormDocuments] = useState<DocumentInfo[]>([]);

  // Fetch data menggunakan TanStack Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["seminar-kp-step3"],
    queryFn: APISeminarKP.getDataMydokumen,
    staleTime: Infinity,
  });

  // Mutation untuk POST link dokumen
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: APISeminarKP.postLinkDokumen,
    onError: (error: any) => {
      toast.error(`${error.response.data.message}`, {
        duration: 3000,
      });
    },
  });

  // Inisialisasi formDocuments berdasarkan data API
  useEffect(() => {
    if (data?.data) {
      const step3Docs = data.data.dokumen_seminar_kp?.step3 || [];
      const step3Accessible = data.data.steps_info?.step3_accessible ?? true;

      const initialDocs = DOCUMENTS.map((title) => {
        const apiDoc = step3Docs.find((doc: any) => DOCUMENT_TYPE_MAP[title] === doc.jenis_dokumen) || {};
        return {
          title,
          status: (apiDoc.status as DocumentStatus) || (step3Accessible ? "default" : "Terkirim"),
          notes: apiDoc.komentar || "",
          link: apiDoc.link_path || "",
        };
      });
      setFormDocuments(initialDocs);
    }
  }, [data]);

  // Handler for link changes
  const handleLinkChange = (index: number, value: string) => {
    const updatedDocs = [...formDocuments];
    updatedDocs[index] = { ...updatedDocs[index], link: value };
    setFormDocuments(updatedDocs);
  };

  const handleReset = () => {
    const resetDocs = formDocuments.map((doc) => {
      if (doc.status === "default" || doc.status === "Ditolak") {
        return { ...doc, link: "" };
      }
      return doc;
    });
    setFormDocuments(resetDocs);
    toast.success("Formulir berhasil dikosongkan", {
      duration: 3000,
    });
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    setIsDialogOpen(false);
    const nim = data?.data.nim;
    const id_pendaftaran_kp = data?.data.pendaftaran_kp[0]?.id;

    // Kirim hanya dokumen dengan status "default" atau "Ditolak" yang memiliki link
    const documentsToSubmit = formDocuments.filter((doc) => doc.link && (doc.status === "default" || doc.status === "Ditolak"));

    if (documentsToSubmit.length === 0) {
      toast.error(`Formulir belum diisi`, {
        duration: 3000,
      });
      return;
    }

    // Array untuk melacak dokumen yang berhasil dikirim
    const successfullySubmittedDocs: string[] = [];

    // Kirim semua dokumen secara paralel dan lacak yang berhasil
    const submissionPromises = documentsToSubmit.map((doc) => {
      const url = DOCUMENT_URLS[doc.title];

      console.log(`Mengirim link untuk "${doc.title}": ${doc.link}`);
      return mutation
        .mutateAsync({
          nim,
          link_path: doc.link!,
          id_pendaftaran_kp,
          url,
        })
        .then(() => {
          successfullySubmittedDocs.push(doc.title);
        })
        .catch((error) => {
          console.error(`Gagal mengirim dokumen "${doc.title}":`, error);
          return null;
        });
    });

    // Tunggu semua pengiriman selesai
    await Promise.all(submissionPromises);

    // Tampilkan toast dokumen berhasil dikirim
    if (successfullySubmittedDocs.length > 0) {
      toast.success("Berhasil mengirim link dokumen", {
        duration: 3000,
      });

      queryClient.invalidateQueries({ queryKey: ["seminar-kp-step3"] });
    }
  };

  // Data untuk InfoCard
  const infoData = useMemo(() => {
    if (!data?.data) {
      return {};
    }

    return {
      judul: data.data.pendaftaran_kp?.[0]?.judul_kp || "Belum diisi",
      jadwal: data.data.jadwal?.[0]?.tanggal
        ? (() => {
            const seminarDate = new Date(data.data.jadwal[0].tanggal);
            const datePart = seminarDate.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            });
            const timeStart = data.data.jadwal[0]?.waktu_mulai
              ? new Date(data.data.jadwal[0].waktu_mulai).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                })
              : "Waktu belum ditentukan";
            const timeEnd = data.data.jadwal[0]?.waktu_selesai
              ? new Date(data.data.jadwal[0].waktu_selesai).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Asia/Jakarta",
                })
              : null;
            return timeEnd ? `${datePart}, ${timeStart} - ${timeEnd}` : `${datePart}, ${timeStart}`;
          })()
        : "Belum diisi",
      ruangan: data.data.jadwal?.[0]?.ruangan?.nama || "Belum diisi",
      dosenPembimbing: data.data.pendaftaran_kp?.[0]?.dosen_pembimbing?.nama || "Belum diisi",
      dosenPenguji: data.data.pendaftaran_kp?.[0]?.dosen_penguji?.nama || "Belum diisi",
      lokasi: data.data.pendaftaran_kp?.[0]?.instansi?.nama || "Belum diisi",
      lamaKerjaPraktik: `${
        data.data.pendaftaran_kp?.[0]?.tanggal_mulai
          ? new Date(data.data.pendaftaran_kp[0].tanggal_mulai).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            })
          : "Belum diisi"
      } - ${
        data.data.pendaftaran_kp?.[0]?.tanggal_selesai
          ? new Date(data.data.pendaftaran_kp[0].tanggal_selesai).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "Asia/Jakarta",
            })
          : "Belum diisi"
      }`,
      kontakPembimbing: data.data.pendaftaran_kp?.[0]?.dosen_pembimbing?.no_hp || "Belum diisi",
      kontakPenguji: data.data.pendaftaran_kp?.[0]?.dosen_penguji?.no_hp || "Belum diisi",
    };
  }, [data]);

  const informasiSeminarFields = ["judul", "jadwal", "ruangan", "dosenPembimbing", "dosenPenguji", "lokasi", "lamaKerjaPraktik", "kontakPembimbing", "kontakPenguji"];

  // Penanganan error fetching
  if (isError) {
    toast.error(`Gagal mengambil data: ${error.message}`, {
      duration: 3000,
    });
  }

  // Calculate countdown days and date status
  const { countdownDays, isToday, isPast } = useMemo(() => {
    if (!data?.data?.jadwal?.[0]?.tanggal) {
      return { countdownDays: 0, isToday: false, isPast: false };
    }

    const seminarDate = new Date(data.data.jadwal[0].tanggal);
    const today = new Date();

    // Reset time parts to compare dates only
    seminarDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = seminarDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      countdownDays: Math.abs(diffDays),
      isToday: diffDays === 0,
      isPast: diffDays < 0,
    };
  }, [data?.data?.jadwal]);

  // Tentukan apakah tombol action harus ditampilkan berdasarkan status dokumen
  const shouldShowActions = useMemo(() => {
    return formDocuments.some((doc) => doc.status === "default" || doc.status === "Ditolak");
  }, [formDocuments]);

  return (
    <div className="space-y-4">
      <div className="flex mb-5">
        <span className="bg-white flex justify-center items-center shadow-sm text-gray-800 dark:text-gray-200 dark:bg-gray-900 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-md font-medium tracking-tight">
          <span className={`inline-block animate-pulse w-3 h-3 rounded-full mr-2 bg-yellow-400`} />
          <LayoutGridIcon className="w-4 h-4 mr-1.5" />
          Validasi Kelengkapan Berkas Seminar Kerja Praktik Mahasiswa
        </span>
      </div>

      <Stepper activeStep={activeStep} />

      <div className="space-y-4">
        {/* Header section with countdown and announcement */}
        <div className="flex flex-col lg:flex-row gap-4 relative overflow-hidden w-full">
          <CountdownCard countdownDays={countdownDays} isToday={isToday} isPast={isPast} />
          <AnnouncementCard />
        </div>

        {isLoading ? <div>Loading InfoCard...</div> : isError ? <div>Error: {error.message}</div> : <InfoCard displayItems={informasiSeminarFields} data={infoData} className="mb-4" />}

        {/* Requirements section */}
        <RequirementsList />

        {/* Document submission form */}
        <DocumentForm documents={formDocuments} showHeader={shouldShowActions} showActions={shouldShowActions} onReset={handleReset} onSubmit={handleOpenDialog} onLinkChange={handleLinkChange} />

        {/* Confirmation Dialog */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Pengiriman</AlertDialogTitle>
              <AlertDialogDescription>Apakah Anda yakin ingin mengirim dokumen ini untuk divalidasi? Dokumen yang telah dikirim tidak dapat diubah sampai proses validasi selesai.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white" disabled={mutation.isPending}>
                {mutation.isPending ? "Mengirim..." : "Yakin"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Step3;
