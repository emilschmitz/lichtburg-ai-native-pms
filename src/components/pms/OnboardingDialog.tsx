import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePmsUi, ExperienceLevel } from "@/lib/pms/ui-store";
import { useState, useEffect } from "react";

export function OnboardingDialog() {
  const { experienceLevel, setExperienceLevel } = usePmsUi();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show on mount (page load) if not already set
    if (!experienceLevel) {
      setOpen(true);
    }
  }, [experienceLevel]);

  const handleSelect = (level: ExperienceLevel) => {
    setExperienceLevel(level);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Lichtburg PMS</DialogTitle>
          <DialogDescription>
            To help us tailor your experience, please tell us about your background with property management systems.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button 
            variant="outline" 
            className="justify-start h-auto py-4 px-6 flex flex-col items-start gap-1"
            onClick={() => handleSelect("new")}
          >
            <span className="font-bold">I'm completely new to PMS</span>
            <span className="text-xs text-muted-foreground font-normal">I've never used a property management system before.</span>
          </Button>
          <Button 
            variant="outline" 
            className="justify-start h-auto py-4 px-6 flex flex-col items-start gap-1"
            onClick={() => handleSelect("other")}
          >
            <span className="font-bold">I've used other PMS</span>
            <span className="text-xs text-muted-foreground font-normal">I'm familiar with systems like Opera, Cloudbeds, or Protel.</span>
          </Button>
          <Button 
            variant="outline" 
            className="justify-start h-auto py-4 px-6 flex flex-col items-start gap-1"
            onClick={() => handleSelect("mews")}
          >
            <span className="font-bold">I've used Mews already</span>
            <span className="text-xs text-muted-foreground font-normal">I'm an experienced Mews user looking for a familiar workflow.</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
