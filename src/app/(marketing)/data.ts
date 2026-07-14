import { APP_IMAGES } from "./lib/imageRegistry";

export type FaqItem = {
  id: string;
  question: string;
  answer?: string;
};

export type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const storySteps = [
  {
    title: "Why should our homes depend on others for energy when the sun gives us everything we need?",
    body: "From that spark, 360watts was born.",
    align: "left" as const,
    image: APP_IMAGES.aboutWalk,
  },
  {
    title: "A vision to make every home energy independent and in sync with the rhythm of life.",
    body: "We began with solar, giving people the power to create their own clean energy.",
    align: "right" as const,
    image: APP_IMAGES.aboutForSale,
  },
  {
    title: "Then came the next step:",
    body: "Smart homes that know when to save, when to run, and maximize usage of solar energy",
    align: "left" as const,
    image: APP_IMAGES.aboutSmartHome,
  },
  {
    title: "At 360watts, we are building that world where homes think, energy flows freely, and independence is powered by intelligence.",
    body: "",
    align: "right" as const,
    image: APP_IMAGES.aboutIdea,
  },
];

export const teamMembers = [
  { name: "Srinath", role: "CEO & Team Lead", photo: APP_IMAGES.teamSrinath },
  { name: "Hariprasad", role: "Solar Design Engineer", photo: APP_IMAGES.teamHariprasad },
  { name: "Parvathi", role: "Product Designer", photo: APP_IMAGES.teamParvathi },
  { name: "Nancy", role: "IoT Developer", photo: APP_IMAGES.teamSelvaNancy },
  { name: "Rajeev", role: "AI/ML Engineer", photo: APP_IMAGES.teamRajeev },
];

export const faqSections: FaqSection[] = [
  {
    id: "general",
    title: "General",
    items: [
      { id: "install-time", question: "How long does installation take?", answer: "Typical solar installation takes 1-2 weeks depending on system size. Our team coordinates everything to minimize disruption." },
      { id: "warranty", question: "What warranty do you provide?", answer: "We provide comprehensive warranties covering equipment, installation workmanship, and system performance guarantees." },
      { id: "upgrade", question: "Can I upgrade my system later?", answer: "Yes! Both solar and smart home systems are designed to be scalable. You can add more panels, batteries, or smart devices as your needs grow." },
    ],
  },
  {
    id: "solar",
    title: "Solar",
    items: [
      { id: "net-metering", question: "How does net metering work?", answer: "Net metering allows you to sell excess solar energy back to the grid. Your meter runs backward when producing more than you consume, offsetting your electricity costs." },
      { id: "financing", question: "What financing options are available?", answer: "We offer flexible financing including subscription models, installment plans, and outright purchase options to suit your budget." },
      { id: "output", question: "What output can I expect from my solar system?", answer: "Output depends on panel size, location, and weather. Our team provides detailed estimates during consultation based on your specific situation." },
      { id: "monsoon", question: "What happens during monsoon or cloudy weather?", answer: "Your system continues to generate power even on cloudy days, though at reduced capacity. You'll automatically draw from the grid when needed, and any battery storage provides backup." },
    ],
  },
  {
    id: "smart-home",
    title: "Smart Home",
    items: [
      { id: "compatibility", question: "Which devices are compatible?", answer: "Our system works with most major smart switches, sensors, and appliances that support common smart home standards. Compatibility keeps expanding with updates." },
      { id: "data-protection", question: "How is my data protected?", answer: "All data is encrypted in transit and at rest. We follow strict security practices as per ISO/IEC 27001 to ensure your home and usage data stays private and secure." },
      { id: "remote", question: "Can I control devices remotely?", answer: "Yes. You can monitor and control your devices from anywhere using the mobile app, as long as you have an internet connection." },
      { id: "hub", question: "Do I need a hub for smart home integration?", answer: "Some devices work directly over Wi-Fi, while others may require a hub for advanced automation and reliability. We recommend the setup that best fits your home." },
    ],
  },
  {
    id: "app",
    title: "App",
    items: [
      { id: "connectivity", question: "What if I lose internet connectivity?", answer: "Core functions continue to work locally. Remote access and cloud features automatically resume once the connection is restored." },
      { id: "family", question: "Can multiple family members access the app?", answer: "Yes. You can add multiple users and assign access levels, so everyone stays in control without compromising security." },
    ],
  },
];

export const localFinalLogo = "/final-logo-png-4x-2.png";

export const heroSlides = [
  {
    bg: APP_IMAGES.smartEnergy,
    bgSrcSet: "/smartEnergy-640.webp 640w, /smartEnergy-1280.webp 1280w, /smartEnergy.webp 1920w",
    bgFallback: "/smartEnergy.png",
    title: "Smarter Energy.\nSmarter Living",
    subtitle: "360watts unites solar power and smart home automation, helping you save more, live cleaner, and control everything effortlessly.",
  },
  {
    bg: APP_IMAGES.solarPowerStation,
    bgSrcSet: "/solarPowerStation-640.webp 640w, /solarPowerStation-1280.webp 1280w, /solarPowerStation.webp 1920w",
    bgFallback: "/solarPowerStation.jpg",
    title: "Power Your Home.\nSave the Planet.",
    subtitle: "Harness the sun's energy with our cutting-edge solar solutions. Reduce bills and your carbon footprint simultaneously.",
  },
];

export const benefitsData = [
  { icon: APP_IMAGES.iconSavings, title: "Save on bills", description: "Reduce your energy costs significantly" },
  { icon: APP_IMAGES.iconEnergy, title: "Energy self-dependence", description: "Generate your own clean power" },
  { icon: APP_IMAGES.iconEco, title: "Eco-friendly living", description: "Reduce your carbon footprint" },
  { icon: APP_IMAGES.iconAuto, title: "Intelligent automation", description: "Smart energy management" },
];

export const processSteps = {
  solar: [
    { number: "1", title: "Solar System Design", description: "Our experts analyze your roof, energy needs, and location to create a custom solar solution optimized for maximum efficiency." },
    { number: "2", title: "Installation", description: "Professional installation by certified technicians. We handle everything from permits to grid connection." },
    { number: "3", title: "Maintenance", description: "Regular monitoring and maintenance ensure peak performance. Our smart monitoring alerts you to any issues before they become problems." },
  ],
  smartHome: [
    { number: "1", title: "Plan & Choose Devices", description: "We map your lifestyle and automation needs, then help you pick the right smart switches, sensors, and appliances — from a few key devices up to a full home." },
    { number: "2", title: "Connect & Automate", description: "Every device links to the 360watts app in minutes. Let AI suggest automations or set your own — routines that adapt to how you actually live." },
    { number: "3", title: "Ongoing Smart Support", description: "We keep the app updated with the latest AI/ML improvements, and you can reach us for support anytime." },
  ],
};

/** The four states of one phone (see AppScreensSection) — one device, one app, everything happens here. */
export const appScreens = [
  { title: "Real-time Insights", description: "Monitor your energy generation, consumption, and savings live, all in one intuitive dashboard.", image: APP_IMAGES.solutionsAppPhoneInsights },
  { title: "Smart Scheduling", description: "Automatically run high-load devices when solar power is abundant to maximize efficiency and reduce costs.", image: APP_IMAGES.solutionsAppPhoneMonitor },
  { title: "Routines and Modes", description: "Set your home to match your daily life. Lights, fans, and devices adjust automatically to your routine.", image: APP_IMAGES.solutionsAppPhoneModes },
  { title: "Maintenance and Care", description: "Easily book service appointments and keep your solar and smart systems performing at their best.", image: APP_IMAGES.solutionsAppPhoneHero },
];

export const appFeatures = [
  { icon: APP_IMAGES.appIcon1, title: "Real-time solar analytics", description: "Monitor your energy production" },
  { icon: APP_IMAGES.appIcon2, title: "Smart device control", description: "Manage all your devices" },
  { icon: APP_IMAGES.appIcon3, title: "Energy health insights", description: "Track system performance" },
  { icon: APP_IMAGES.appIcon4, title: "Bill tracking", description: "Monitor your savings" },
];

export const contactMethods = [
  { icon: APP_IMAGES.iconEmail, title: "Email Us", value: "hello@360watts.com", note: "We reply within 24 hrs", href: "mailto:hello@360watts.com" },
  { icon: APP_IMAGES.iconPhone, title: "Call Us", value: "9087610051", note: "Mon-Fri, 9am-6pm", href: "tel:+919087610051" },
  { icon: APP_IMAGES.iconLocation, title: "Visit Us", value: "Coimbatore, Tamil Nadu", note: "By appointment only", href: "https://www.google.com/maps/search/?api=1&query=GRG+INCUBATION+CENTER,+Coimbatore,+Tamil+Nadu" },
];
