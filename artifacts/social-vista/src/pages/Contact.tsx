import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { useSubmitContact, useListServices } from "@workspace/api-client-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const submitContact = useSubmitContact();
  const { data: services } = useListServices();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", service: "", message: "" },
  });

  function onSubmit(values: ContactForm) {
    submitContact.mutate(
      { data: { name: values.name, email: values.email, phone: values.phone, message: values.message, service: values.service } },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => toast({ title: "Something went wrong. Please try again.", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-xs text-primary font-medium mb-5">
              Get In Touch
            </div>
            <h1 className="text-5xl font-bold font-serif mb-4">
              Let's Build Something <span className="text-gradient">Remarkable</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Tell us about your project and we will get back to you within 24 hours with a tailored proposal.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12">
            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card card-glow rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-5 text-lg">Contact Details</h3>
                <div className="space-y-4">
                  {[
                    { icon: Mail, label: "Email", value: "hello@socialvista.agency" },
                    { icon: Phone, label: "Phone", value: "+1 (555) 000-0000" },
                    { icon: MapPin, label: "Location", value: "Global — Remote First" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
                        <div className="text-sm text-foreground mt-0.5">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card card-glow rounded-2xl p-6">
                <h3 className="font-semibold text-foreground mb-3">Response Time</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  We typically reply within 2–4 hours during business hours.
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-2xl p-6 border border-primary/20">
                <h3 className="font-semibold text-foreground mb-2">Free Consultation</h3>
                <p className="text-sm text-muted-foreground">Book a 30-minute strategy call — no commitment, just clarity on how we can help.</p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-card rounded-2xl p-12 text-center card-glow h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mb-5 glow-accent">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif mb-3">Message Received!</h3>
                  <p className="text-muted-foreground max-w-xs">
                    Thank you for reaching out. Our team will review your message and get back to you shortly.
                  </p>
                  <Button
                    className="mt-8 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => { setSubmitted(false); form.reset(); }}
                    data-testid="button-send-another"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <div className="bg-card rounded-2xl p-8 card-glow">
                  <h3 className="font-semibold text-foreground text-xl mb-6">Tell Us About Your Project</h3>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground text-sm">Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="John Smith" {...field} data-testid="input-contact-name" className="bg-muted border-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground text-sm">Email Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="you@company.com" type="email" {...field} data-testid="input-contact-email" className="bg-muted border-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground text-sm">Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 000-0000" {...field} data-testid="input-contact-phone" className="bg-muted border-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="service"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground text-sm">Service Interested In</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-muted border-input" data-testid="select-contact-service">
                                    <SelectValue placeholder="Select a service" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {services?.filter(s => s.active).map(s => (
                                    <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>
                                  ))}
                                  <SelectItem value="Other">Other / Not Sure</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground text-sm">Message *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us about your goals, timeline, and budget..."
                                rows={5}
                                {...field}
                                data-testid="input-contact-message"
                                className="bg-muted border-input resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold glow-primary py-6"
                        disabled={submitContact.isPending}
                        data-testid="button-contact-submit"
                      >
                        {submitContact.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
