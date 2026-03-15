using GaziStudyAI.Application.ServiceRegistration;
using GaziStudyAI.Infrastructure.Context;
using GaziStudyAI.WebAPI.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text; // REQUIRED FOR SWAGGER SECURITY

var builder = WebApplication.CreateBuilder(args);

// 1. Add DbContext
builder.Services.AddDbContext<GaziStudyAIDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddApplicationServices();
builder.Services.AddControllers();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        // Notice this exactly matches "JwtSettings:SecretKey" from your TokenService!
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!)),

        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],

        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],

        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,

        RoleClaimType = "Role"
    };
});

// 2. Add HttpContextAccessor (For Audit Logs)
builder.Services.AddHttpContextAccessor();

builder.Services.AddEndpointsApiExplorer();

// 3. Configure Swagger for JWT Auth (Token Only Input)
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GaziStudyAI API", Version = "v1" });

    // Define the security scheme
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter your JWT token directly below. Swagger will automatically add 'Bearer ' behind the scenes.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http, // This tells Swagger UI to only ask for the raw token
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    // Apply the security requirement to all endpoints
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddHttpClient();

var app = builder.Build();

await DbInitializer.SeedAdminUserAsync(app.Services, builder.Configuration);


// --- PIPELINE CONFIGURATION ---

app.UseCors(options =>
    options.WithOrigins("http://localhost:4200")
    .AllowAnyMethod()
    .AllowAnyHeader());

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles(); // CRITICAL: This allows Angular to view the images via URL

// CRITICAL: These must come BEFORE MapControllers for [Authorize] to work!
app.UseAuthentication();
app.UseAuthorization();

// 4. Map Controllers
app.MapControllers();

app.Run();