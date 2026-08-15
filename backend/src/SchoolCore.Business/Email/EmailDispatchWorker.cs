using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SchoolCore.Business.Services;

namespace SchoolCore.Business.Email;

/// <summary>Worker que despacha correos de la cola in-process (envío async fuera del request HTTP).</summary>
public sealed class EmailDispatchWorker : BackgroundService
{
    private readonly IEmailQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailDispatchWorker> _logger;

    public EmailDispatchWorker(
        IEmailQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<EmailDispatchWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Email dispatch worker started.");
        await foreach (var message in _queue.DequeueAllAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
                await sender.SendAsync(message.ToAddress, message.Subject, message.HtmlBody, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}", message.ToAddress);
            }
        }
        _logger.LogInformation("Email dispatch worker stopped.");
    }
}
