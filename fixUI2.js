const fs = require('fs');
const file = '/Users/deniz/Documents/navikont-admin-2/src/app/(app)/apps/[appId]/patients/[enrollmentId]/PatientDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const handleViewDetailsStr = `
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const handleViewDetails = async (log: any) => {
    setSelectedLog(log);
    setDetailedData(null);
    setIsFetchingDetails(false);

    if (log.module_type === 'checkin' || log.module_type === 'questionnaire' || log.module_type === 'question_answer') {
      setIsFetchingDetails(true);
      try {
        const details = await getDetailedModuleAnswers(
          patient.enrollment_id,
          patient.user_id,
          log.module_type,
          log.completed_at,
          log.module_version_id
        );
        setDetailedData(details);
      } catch (err) {
        console.error('Failed to fetch details:', err);
      } finally {
        setIsFetchingDetails(false);
      }
    }
  };
`;

content = content.replace("  const [isPending, startTransition] = useTransition();", "  const [isPending, startTransition] = useTransition();\n" + handleViewDetailsStr);
fs.writeFileSync(file, content);
console.log('Fixed variables');
