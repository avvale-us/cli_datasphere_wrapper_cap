@requires: 'authenticated-user'
service DatasphereCliService {

    // Equivalent to run_task_chain
    action   runTaskChain(space: String, object: String)                      returns String;

    // Equivalent to get_logs
    function getLogs(space: String, object: String)                           returns String;

    // Equivalent to get_log_details
    function getLogDetails(space: String, log_id: String, info_level: String) returns String;

    // Equivalent to get_secrets
    function getSecrets()                                                     returns String;

    // Equivalent to update_secrets
    action   updateSecrets(payload: String)                                   returns String;

    // Equivalent to get_host
    function getHost()                                                        returns String;

    // Equivalent to update_host
    action   updateHost(new_host: String)                                     returns String;
}
