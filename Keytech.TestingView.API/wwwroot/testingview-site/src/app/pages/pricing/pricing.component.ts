import { Component } from '@angular/core';

interface Plan {
  name: string;
  price: string;
  cadence: string;
  accent?: boolean;
  features: string[];
}

@Component({
  selector: 'app-pricing',
  imports: [],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent {
  readonly plans: Plan[] = [
    {
      name: 'Starter',
      price: '$0',
      cadence: 'Free trial / limited',
      features: [
        'Single backtesting session',
        'Core replay + manual trade journaling',
        'Basic run-up / drawdown / RR metrics',
        'Go-to-date tools with usage limits'
      ]
    },
    {
      name: 'Pro',
      price: '$29',
      cadence: 'per month',
      accent: true,
      features: [
        'Multiple sessions + ChronoShuffle ranges',
        'Auto break-even (BE) support',
        'Journal customization and snapshot automation',
        'Session export (Excel/CSV)'
      ]
    },
    {
      name: 'Elite',
      price: '$59',
      cadence: 'per month',
      features: [
        'Advanced metrics dashboard',
        'Trading-cost impact simulation',
        'Multi-chart workflows and review mode',
        'Priority support + advanced add-ons'
      ]
    }
  ];
}
