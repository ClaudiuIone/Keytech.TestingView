# TestingView.com Website (Keytech.TestingView.Web.FE)

Angular SSR frontend with ASP.NET Core backend for the public TestingView marketing site.

## Run locally

1. Apply database schema (once):

   ```bash
   sqlcmd -S .\SQL1 -d TestingView -E -i ..\..\Keytech.TestingView.Data\Keytech.TestingView.Data\Sql\WebSchema.sql
   ```

2. Configure user secrets (do not commit live keys):

   ```bash
   cd Keytech.TestingView.Web.FE
   dotnet user-secrets set "Google:ClientSecret" "<your-secret>"
   dotnet user-secrets set "Stripe:SecretKey" "<your-stripe-secret>"
   dotnet user-secrets set "Stripe:AccountId" "acct_..."   # required for sk_org_ organization keys
   dotnet user-secrets set "Stripe:WebhookSecret" "whsec_..."
   dotnet user-secrets set "Stripe:PublishableKey" "pk_live_..."   # optional; Checkout is server-side
   dotnet user-secrets set "Stripe:ExplorerPriceId" "price_..."   # optional; inline PriceData used if omitted
   dotnet user-secrets set "Stripe:TraderPriceId" "price_..."

   Or copy `../stripe.local.json.example` to `../stripe.local.json` and run `deploy/Deploy-LocalIis.ps1` (imports secrets automatically).
   dotnet user-secrets set "Email:Password" "<smtp-password>"
   ```

3. Terminal A — Angular dev server:

   ```bash
   cd ClientApp
   npm start
   ```

4. Terminal B — ASP.NET API + static assets:

   ```bash
   dotnet run --project Keytech.TestingView.Web.FE.csproj
   ```

   Open http://localhost:5130

## Production build

```bash
cd ClientApp && npm run build
cd .. && dotnet publish -c Release
```

Static assets are served from `../Resources` at `/assets/`.
