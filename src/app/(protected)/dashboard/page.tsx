import getAnalyticsData from "@/actions/get-analytics"
import AdminDashboardKPIs from "@/components/pages/HomePageAnalytics"

export default async function ProtectedPage() {
    const data =await getAnalyticsData();
    // console.log(data);    
    return (
        <>
            <AdminDashboardKPIs data={data.data} />
        </>
    )
}