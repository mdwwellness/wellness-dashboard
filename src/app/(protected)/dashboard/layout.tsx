import SlimSidebar from "@/components/SlimSidebar";

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
        <SlimSidebar>
          {children}
        </SlimSidebar>
    </>
  )
}
